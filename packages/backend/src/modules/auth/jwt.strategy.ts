import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { JwtPayload, RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const keycloakUrl = config.get('KEYCLOAK_URL', 'http://localhost:8080');
    const realm = config.get('KEYCLOAK_REALM', 'kosm');
    const issuer = config.get('JWT_ISSUER', `${keycloakUrl}/realms/${realm}`);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
      issuer,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): RequestUser {
    const clientId = 'kosm-api';
    const realmRoles = payload.realm_access?.roles || [];
    const clientRoles = payload.resource_access?.[clientId]?.roles || [];
    const allRoles = [...new Set([...realmRoles, ...clientRoles])];

    return {
      keycloakId: payload.sub,
      email: payload.email,
      roles: allRoles,
      orgId: payload.org_id,
      salonIds: payload.salon_ids,
      staffRole: payload.staff_role,
    };
  }
}
