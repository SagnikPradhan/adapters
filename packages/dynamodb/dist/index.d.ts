import { Profile, Session, User } from "next-auth"
import { Adapter } from "next-auth/adapters"
export declare const DynamoDBAdapter: Adapter<
  any,
  {
    tableName: string
  },
  User & {
    emailVerified?: Date
  },
  Profile & {
    emailVerified?: Date
  },
  Session
>
