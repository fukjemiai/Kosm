import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../database/entities';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async findOrCreateByKeycloak(keycloakId: string, email: string, name?: { first?: string; last?: string }): Promise<Customer> {
    let customer = await this.repo.findOne({ where: { keycloakId } });
    if (customer) return customer;

    customer = this.repo.create({
      keycloakId,
      email,
      firstName: name?.first || null,
      lastName: name?.last || null,
      isGuest: false,
      gdprConsentAt: new Date(),
    });
    return this.repo.save(customer);
  }

  async findOrCreateGuest(email: string, phone?: string, name?: { first?: string; last?: string }): Promise<Customer> {
    // Hledej existujícího guest zákazníka dle emailu
    let customer = await this.repo.findOne({ where: { email, isGuest: true } });
    if (customer) return customer;

    customer = this.repo.create({
      email,
      phone: phone || null,
      firstName: name?.first || null,
      lastName: name?.last || null,
      isGuest: true,
      gdprConsentAt: new Date(),
      // GDPR: automatická retention na 2 roky od posledního kontaktu
      dataRetentionUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
    });
    return this.repo.save(customer);
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Zákazník nenalezen');
    return customer;
  }

  async findByKeycloakId(keycloakId: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { keycloakId } });
  }

  async search(query: string, limit: number = 20): Promise<Customer[]> {
    return this.repo
      .createQueryBuilder('c')
      .where('c.email ILIKE :q OR c.phone ILIKE :q OR c.first_name ILIKE :q OR c.last_name ILIKE :q', {
        q: `%${query}%`,
      })
      .andWhere('c.is_active = true')
      .limit(limit)
      .getMany();
  }

  async deleteGdprExpired(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Customer)
      .set({
        email: null,
        phone: null,
        firstName: null,
        lastName: null,
        notes: null,
        isActive: false,
      })
      .where('data_retention_until < NOW()')
      .andWhere('is_guest = true')
      .execute();
    return result.affected || 0;
  }
}
