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

