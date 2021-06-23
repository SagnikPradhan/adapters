import type firebase from "firebase"
import { Adapter } from "next-auth/adapters"
import { Profile, Session, User } from "next-auth"
export declare type FirebaseSession = Session & {
  id: string
  expires: Date
}
export declare const FirebaseAdapter: Adapter<
  firebase.firestore.Firestore,
  never,
  User & {
    id: string
  },
  Profile,
  FirebaseSession
>
