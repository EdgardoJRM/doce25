import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

export interface UserInfo {
  email: string;
  sub: string;
  groups: string[];
}

export async function getCurrentUserInfo(): Promise<UserInfo | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    
    const groups = (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) || [];

    return {
      email: user.signInDetails?.loginId || '',
      sub: user.userId,
      groups,
    };
  } catch (error) {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUserInfo();
  return user !== null;
}

export async function hasGroup(groupName: string): Promise<boolean> {
  const user = await getCurrentUserInfo();
  if (!user) return false;
  return user.groups.includes(groupName);
}

export async function isAdmin(): Promise<boolean> {
  return hasGroup('admin');
}

export async function isStaffOrAdmin(): Promise<boolean> {
  const user = await getCurrentUserInfo();
  if (!user) return false;
  return user.groups.includes('admin') || user.groups.includes('staff');
}

