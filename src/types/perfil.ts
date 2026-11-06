export interface MyProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  headline: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface MyProfilePatch {
  name: string;
  phone: string;
  headline: string;
  bio: string;
}
