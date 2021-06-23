import type firebase from "firebase"
/**
 * Takes in a snapshot and returns all of its `data()`,
 * as well as `id` and `createdAt` and `updatedAt` `Date`
 */
export declare function docSnapshotToObject<T>(
  snapshot: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>
): T | null
export declare function querySnapshotToObject<T>(
  snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
): T | null
/** Firebase does not like `undefined` values */
export declare function stripUndefined(obj: any): {
  [k: string]: unknown
}
