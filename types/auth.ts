export interface LoginRequest {
  email: string;
  password: string;
  user_type: 'student' | 'college' | 'admin' | 'enterprise';
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_type: string;
  user_id: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  user_type: 'student' | 'college' | 'admin' | 'enterprise';
  phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Student extends User {
  user_type: 'student';
  college_id?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  resume_url?: string;
  ats_score?: number;
  created_by_admin: boolean;
}

export interface College extends User {
  user_type: 'college';
  college_name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
}

export interface Admin extends User {
  user_type: 'admin';
  role: string;
}






