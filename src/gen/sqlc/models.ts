// Code generated by sqlc-gen-typescript-d1. DO NOT EDIT.
// versions:
//   sqlc v1.19.1
//   sqlc-gen-typescript-d1 v0.0.0-a@52264a13ee2c3ae19113d481ae7fbb50a5730ff0

export type Org = {
  pk: number;
  id: string;
  displayName: string;
};

export type Account = {
  pk: number;
  id: string;
  displayName: string;
  email: string | null;
};

export type OrgAccount = {
  orgPk: number;
  accountPk: number;
};

export type AccountLog = {
  pk: number;
  tag: string;
  time: string | null;
  data: string;
};

