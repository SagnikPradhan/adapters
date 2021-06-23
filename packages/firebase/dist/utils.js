"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.stripUndefined =
  exports.querySnapshotToObject =
  exports.docSnapshotToObject =
    void 0
/**
 * Takes in a snapshot and returns all of its `data()`,
 * as well as `id` and `createdAt` and `updatedAt` `Date`
 */
function docSnapshotToObject(snapshot) {
  if (!snapshot.exists) {
    return null
  }
  const data = snapshot.data()
  if (data.expires) {
    data.expires = data.expires.toDate()
  }
  return { id: snapshot.id, ...data }
}
exports.docSnapshotToObject = docSnapshotToObject
function querySnapshotToObject(snapshot) {
  if (snapshot.empty) {
    return null
  }
  const doc = snapshot.docs[0]
  const data = doc.data()
  if (data.expires) {
    data.expires = data.expires.toDate()
  }
  return { id: doc.id, ...data }
}
exports.querySnapshotToObject = querySnapshotToObject
/** Firebase does not like `undefined` values */
function stripUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => typeof value !== "undefined")
  )
}
exports.stripUndefined = stripUndefined
