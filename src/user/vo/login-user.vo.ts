interface UserInfo {
  id: number;
  username: string;
  nick_name: string;
  email: string;
  avatar: string;
  phone_number: string;
  is_admin: boolean;
  is_frozen: boolean;
  create_time: Date;
  roles: string[];
  permissions: string[];
}

export class LoginUserVO {
  userInfo: UserInfo;
  accessToken: string;
  refreshToken: string;
}
