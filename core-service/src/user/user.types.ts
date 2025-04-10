export interface CreateUserEntity {
  firstName: string;
  lastName: string;
  email: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}
