"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.PouchDBAdapter = void 0
const crypto_1 = require("crypto")
const ulid_1 = require("ulid")
const PouchDBAdapter = (pouchdb) => {
  return {
    async getAdapter({ session, secret, ...appOptions }) {
      // create PoucDB indexes if they don't exist
      const res = await pouchdb.getIndexes()
      const indexes = res.indexes.map((index) => index.name, [])
      if (!indexes.includes("nextAuthUserByEmail")) {
        await pouchdb.createIndex({
          index: {
            name: "nextAuthUserByEmail",
            ddoc: "nextAuthUserByEmail",
            fields: ["data.email"],
          },
        })
      }
      if (!indexes.includes("nextAuthAccountByProviderId")) {
        await pouchdb.createIndex({
          index: {
            name: "nextAuthAccountByProviderId",
            ddoc: "nextAuthAccountByProviderId",
            fields: ["data.providerId", "data.providerAccountId"],
          },
        })
      }
      if (!indexes.includes("nextAuthSessionByToken")) {
        await pouchdb.createIndex({
          index: {
            name: "nextAuthSessionByToken",
            ddoc: "nextAuthSessionByToken",
            fields: ["data.sessionToken"],
          },
        })
      }
      if (!indexes.includes("nextAuthVerificationRequestByToken")) {
        await pouchdb.createIndex({
          index: {
            name: "nextAuthVerificationRequestByToken",
            ddoc: "nextAuthVerificationRequestByToken",
            fields: ["data.identifier", "data.token"],
          },
        })
      }
      const sessionMaxAge = session.maxAge * 1000 // default is 30 days
      const sessionUpdateAge = session.updateAge * 1000 // default is 1 day
      const hashToken = (token) =>
        crypto_1.createHash("sha256").update(`${token}${secret}`).digest("hex")
      return {
        displayName: "POUCHDB",
        async createUser(profile) {
          const data = {
            ...profile,
            id: ["USER", ulid_1.ulid()].join("_"),
          }
          await pouchdb.put({
            _id: data.id,
            data,
          })
          return data
        },
        async getUser(id) {
          var _a, _b
          const res = await pouchdb.get(id)
          if (
            typeof ((_a = res.data) === null || _a === void 0
              ? void 0
              : _a.emailVerified) === "string"
          ) {
            res.data.emailVerified = new Date(res.data.emailVerified)
          }
          return (_b = res === null || res === void 0 ? void 0 : res.data) !==
            null && _b !== void 0
            ? _b
            : null
        },
        async getUserByEmail(email) {
          const res = await pouchdb.find({
            use_index: "nextAuthUserByEmail",
            selector: { "data.email": { $eq: email } },
            limit: 1,
          })
          const userDoc = res.docs[0]
          if (userDoc === null || userDoc === void 0 ? void 0 : userDoc.data) {
            const user = userDoc.data
            if (typeof user.emailVerified === "string")
              user.emailVerified = new Date(user.emailVerified)
            return user
          }
          return null
        },
        async getUserByProviderAccountId(providerId, providerAccountId) {
          var _a
          const res = await pouchdb.find({
            use_index: "nextAuthAccountByProviderId",
            selector: {
              "data.providerId": { $eq: providerId },
              "data.providerAccountId": { $eq: providerAccountId },
            },
            limit: 1,
          })
          const accountDoc = res.docs[0]
          if (
            accountDoc === null || accountDoc === void 0
              ? void 0
              : accountDoc.data
          ) {
            const userDoc = await pouchdb.get(accountDoc.data.userId)
            return (_a =
              userDoc === null || userDoc === void 0
                ? void 0
                : userDoc.data) !== null && _a !== void 0
              ? _a
              : null
          }
          return null
        },
        async updateUser(user) {
          const update = { ...user }
          const doc = await pouchdb.get(user.id)
          doc.data = {
            ...doc.data,
            ...update,
          }
          await pouchdb.put(doc)
          return doc.data
        },
        async deleteUser(id) {
          const doc = await pouchdb.get(id)
          await pouchdb.put({
            ...doc,
            _deleted: true,
          })
        },
        async linkAccount(
          userId,
          providerId,
          providerType,
          providerAccountId,
          refreshToken,
          accessToken,
          accessTokenExpires
        ) {
          await pouchdb.put({
            _id: ["ACCOUNT", ulid_1.ulid()].join("_"),
            data: {
              userId,
              providerId,
              providerType,
              providerAccountId,
              refreshToken,
              accessToken,
              accessTokenExpires:
                accessTokenExpires != null
                  ? new Date(accessTokenExpires)
                  : null,
            },
          })
        },
        async unlinkAccount(_, providerId, providerAccountId) {
          const account = await pouchdb.find({
            use_index: "nextAuthAccountByProviderId",
            selector: {
              "data.providerId": { $eq: providerId },
              "data.providerAccountId": { $eq: providerAccountId },
            },
            limit: 1,
          })
          await pouchdb.put({
            ...account.docs[0],
            _deleted: true,
          })
        },
        async createSession(user) {
          const data = {
            userId: user.id,
            sessionToken: crypto_1.randomBytes(32).toString("hex"),
            accessToken: crypto_1.randomBytes(32).toString("hex"),
            expires: new Date(Date.now() + sessionMaxAge),
          }
          await pouchdb.put({
            _id: ["SESSION", ulid_1.ulid()].join("_"),
            data,
          })
          return data
        },
        async getSession(sessionToken) {
          var _a, _b
          const res = await pouchdb.find({
            use_index: "nextAuthSessionByToken",
            selector: {
              "data.sessionToken": { $eq: sessionToken },
            },
            limit: 1,
          })
          const sessionDoc = res.docs[0]
          if (sessionDoc.data) {
            const session = sessionDoc.data
            if (
              new Date(
                (_a =
                  session === null || session === void 0
                    ? void 0
                    : session.expires) !== null && _a !== void 0
                  ? _a
                  : Infinity
              ) < new Date()
            ) {
              await pouchdb.put({ ...sessionDoc, _deleted: true })
              return null
            }
            return {
              ...session,
              expires: new Date(
                (_b =
                  session === null || session === void 0
                    ? void 0
                    : session.expires) !== null && _b !== void 0
                  ? _b
                  : ""
              ),
            }
          }
          return null
        },
        async updateSession(session, force) {
          if (
            !force &&
            Number(session.expires) - sessionMaxAge + sessionUpdateAge >
              Date.now()
          ) {
            return null
          }
          const res = await pouchdb.find({
            use_index: "nextAuthSessionByToken",
            selector: {
              "data.sessionToken": { $eq: session.sessionToken },
            },
            limit: 1,
          })
          const previousSessionDoc = res.docs[0]
          if (
            previousSessionDoc === null || previousSessionDoc === void 0
              ? void 0
              : previousSessionDoc.data
          ) {
            const currentSessionDoc = {
              ...previousSessionDoc,
              data: {
                ...previousSessionDoc.data,
                expires: new Date(Date.now() + sessionMaxAge),
              },
            }
            await pouchdb.put(currentSessionDoc)
            return currentSessionDoc.data
          }
          return null
        },
        async deleteSession(sessionToken) {
          const res = await pouchdb.find({
            use_index: "nextAuthSessionByToken",
            selector: {
              "data.sessionToken": { $eq: sessionToken },
            },
            limit: 1,
          })
          const sessionDoc = res.docs[0]
          await pouchdb.put({
            ...sessionDoc,
            _deleted: true,
          })
        },
        async createVerificationRequest(identifier, url, token, _, provider) {
          const hashedToken = hashToken(token)
          const data = {
            identifier,
            token: hashedToken,
            expires: new Date(Date.now() + provider.maxAge * 1000),
          }
          await pouchdb.put({
            _id: ["VERIFICATION-REQUEST", ulid_1.ulid()].join("_"),
            data,
          })
          await provider.sendVerificationRequest({
            identifier,
            url,
            token,
            baseUrl: appOptions.baseUrl,
            provider,
          })
        },
        async getVerificationRequest(identifier, token) {
          var _a, _b
          const hashedToken = hashToken(token)
          const res = await pouchdb.find({
            use_index: "nextAuthVerificationRequestByToken",
            selector: {
              "data.identifier": { $eq: identifier },
              "data.token": { $eq: hashedToken },
            },
            limit: 1,
          })
          const verificationRequestDoc = res.docs[0]
          if (
            verificationRequestDoc === null || verificationRequestDoc === void 0
              ? void 0
              : verificationRequestDoc.data
          ) {
            const verificationRequest = verificationRequestDoc.data
            if (
              new Date(
                (_a =
                  verificationRequest === null || verificationRequest === void 0
                    ? void 0
                    : verificationRequest.expires) !== null && _a !== void 0
                  ? _a
                  : Infinity
              ) < new Date()
            ) {
              await pouchdb.put({
                ...verificationRequestDoc,
                _deleted: true,
              })
              return null
            }
            return {
              ...verificationRequest,
              expires: new Date(
                (_b =
                  verificationRequest === null || verificationRequest === void 0
                    ? void 0
                    : verificationRequest.expires) !== null && _b !== void 0
                  ? _b
                  : ""
              ),
            }
          }
          return null
        },
        async deleteVerificationRequest(identifier, token) {
          const hashedToken = hashToken(token)
          const res = await pouchdb.find({
            use_index: "nextAuthVerificationRequestByToken",
            selector: {
              "data.identifier": { $eq: identifier },
              "data.token": { $eq: hashedToken },
            },
            limit: 1,
          })
          const verificationRequestDoc = res.docs[0]
          await pouchdb.put({
            ...verificationRequestDoc,
            _deleted: true,
          })
        },
      }
    },
  }
}
exports.PouchDBAdapter = PouchDBAdapter
