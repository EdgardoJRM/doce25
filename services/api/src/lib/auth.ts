import { APIGatewayProxyEventV2 } from 'aws-lambda';

export interface UserContext {
  sub: string;
  email: string;
  groups: string[];
}

export function getUserFromEvent(event: APIGatewayProxyEventV2): UserContext | null {
  try {
    const claims = event.requestContext.authorizer?.jwt?.claims;
    if (!claims) return null;

    return {
      sub: claims.sub as string,
      email: claims.email as string,
      groups: claims['cognito:groups'] ? (claims['cognito:groups'] as string).split(',') : [],
    };
  } catch (error) {
    return null;
  }
}

export function hasGroup(user: UserContext | null, group: string): boolean {
  if (!user) return false;
  return user.groups.includes(group);
}

export function isAdmin(user: UserContext | null): boolean {
  return hasGroup(user, 'admin');
}

export function isStaffOrAdmin(user: UserContext | null): boolean {
  return hasGroup(user, 'admin') || hasGroup(user, 'staff');
}

