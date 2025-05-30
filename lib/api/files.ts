import TAKAPI from '../api.js';
import FormData from 'form-data';
import { Readable } from 'node:stream';
import mime from 'mime';
import { Type, Static } from '@sinclair/typebox';

export const Content = Type.Object({
  UID: Type.String(),
  SubmissionDateTime: Type.String(),
  Keywords: Type.Array(Type.String()),
  MIMEType: Type.String(),
  SubmissionUser: Type.String(),
  PrimaryKey: Type.String(),
  Hash: Type.String(),
  CreatorUid: Type.String(),
  Name: Type.String()
});

export const Config = Type.Object({
    uploadSizeLimit: Type.Integer()
})

export default class File {
    api: TAKAPI;

    constructor(api: TAKAPI) {
        this.api = api;
    }

    // TODO Investigate this endpoint
    list() {
        new URL(`/Marti/api/sync/search`, this.api.url);
        // param hash=<hash>
    } 

    async meta(hash: string): Promise<string> {
        const url = new URL(`/Marti/sync/${encodeURIComponent(hash)}/metadata`, this.api.url);

        const res = await this.api.fetch(url, {
            method: 'GET'
        }, true);

        const body = await res.text();

        return body;
    }

    async download(hash: string): Promise<Readable> {
        const url = new URL(`/Marti/sync/content`, this.api.url);
        url.searchParams.append('hash', hash);

        const res = await this.api.fetch(url, {
            method: 'GET'
        }, true);

        return res.body;
    }

    async adminDelete(hash: string) {
        const url = new URL(`/Marti/api/files/${hash}`, this.api.url);

        return await this.api.fetch(url, {
            method: 'DELETE',
        });
    }

    async delete(hash: string) {
        const url = new URL(`/Marti/sync/delete`, this.api.url);
        url.searchParams.append('hash', hash)

        return await this.api.fetch(url, {
            method: 'DELETE',
        });
    }

    // TODO Return a Content Object
    async uploadPackage(opts: {
        name: string;
        creatorUid: string;
        hash: string;
    }, body: Readable | Buffer): Promise<string> {
        const url = new URL(`/Marti/sync/missionupload`, this.api.url);
        url.searchParams.append('filename', opts.name)
        url.searchParams.append('creatorUid', opts.creatorUid)
        url.searchParams.append('hash', opts.hash)

        if (body instanceof Buffer) {
            body = Readable.from(body as Buffer);
        }

        const form = new FormData()
        form.append('assetfile', body as Readable);

        const res = await this.api.fetch(url, {
            method: 'POST',
            body: form
        }) as string;

        return res;
    }

    async upload(opts: {
        name: string;
        contentLength: number;
        contentType?: string;
        keywords: string[];
        creatorUid: string;
        latitude?: string;
        longitude?: string;
        altitude?: string;
    }, body: Readable | Buffer): Promise<Static<typeof Content>> {
        const url = new URL(`/Marti/sync/upload`, this.api.url);
        url.searchParams.append('name', opts.name)
        url.searchParams.append('keywords', opts.keywords.join(','))
        url.searchParams.append('creatorUid', opts.creatorUid)
        if (opts.altitude) url.searchParams.append('altitude', opts.altitude);
        if (opts.longitude) url.searchParams.append('longitude', opts.longitude);
        if (opts.latitude) url.searchParams.append('latitude', opts.latitude);

        if (body instanceof Buffer) {
            body = Readable.from(body as Buffer);
        }

        const res = await this.api.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': opts.contentType ? opts.contentType : mime.getType(opts.name),
                'Content-Length': opts.contentLength
            },
            body: body as Readable
        });

        return JSON.parse(res);
    }

    async count() {
        const url = new URL('/Marti/api/files/metadata/count', this.api.url);

        return await this.api.fetch(url, {
            method: 'GET'
        });
    }

    async config(): Promise<Static<typeof Config>> {
        const url = new URL('/files/api/config', this.api.url);

        return await this.api.fetch(url, {
            method: 'GET'
        });
    }
}
