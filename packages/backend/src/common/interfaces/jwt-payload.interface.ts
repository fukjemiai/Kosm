export interface JwtPayload {
  sub: string;           // Keycloak user ID
  email: string;
  email_verified: boolean;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
  // Custom claims added via Keycloak mapper
  org_id?: string;
  salon_ids?: string[];
  staff_role?: string;
}

export interface RequestUser {
  keycloakId: string;
  email: string;
  roles: string[];
  orgId?: string;
  salonIds?: string[];
  staffRole?: string;
}
