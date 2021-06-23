/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import type { Adapter } from "next-auth/adapters"
import { Profile } from "next-auth"
interface PouchdbUser {
  id: string
  name?: string
  email?: string
  emailVerified?: Date | string
  image?: string
}
interface PouchdbSession {
  userId: string
  expires: Date | string
  sessionToken: string
  accessToken: string
}
export declare const PouchDBAdapter: Adapter<
  PouchDB.Database,
  never,
  PouchdbUser,
  Profile & {
    emailVerified?: Date
  },
  PouchdbSession
>
export {}
