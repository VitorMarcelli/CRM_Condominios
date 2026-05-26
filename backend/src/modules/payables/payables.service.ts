import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface CreatePayableDto {
  condominiumId: string;
  description: string;
  amount: number;
  dueDate: Date | string;
  category: string;
  barcode?: string;
  notes?: string;
  documentUrl?: string;
}

interface UpdatePayableDto {
  description?: string;
  amount?: number;
  dueDate?: Date | string;
  category?: string;
  status?: string;
  barcode?: string;
  notes?: string;
  documentUrl?: string;
}

interface PayPayableDto {
  paidAt: Date | string;
  interestAmount?: number;
  fineAmount?: number;
  discountAmount?: number;
  receiptUrl?: string;
}

@Injectable()
export class PayablesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePayableDto) {
    let condoId = data.condominiumId;
    if (!condoId) {
      const firstCondo = await this.prisma.condominium.findFirst();
      if (!firstCondo) throw new NotFoundException('Nenhum condomínio encontrado para vincular a conta');
      condoId = firstCondo.id;
    }

    return this.prisma.payable.create({
      data: {
        condominiumId: condoId,
        description: data.description,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        category: data.category,
        barcode: data.barcode,
        notes: data.notes,
        documentUrl: data.documentUrl,
        status: 'PENDING',
      },
    });
  }

  async findAll(condominiumId?: string) {
    const where = condominiumId ? { condominiumId } : {};
    return this.prisma.payable.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const payable = await this.prisma.payable.findUnique({ where: { id } });
    if (!payable) throw new NotFoundException('Conta não encontrada');
    return payable;
  }

  async update(id: string, data: UpdatePayableDto) {
    await this.findOne(id);
    return this.prisma.payable.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payable.delete({ where: { id } });
  }

  async pay(id: string, data: PayPayableDto) {
    const payable = await this.findOne(id);
    
    const interest = data.interestAmount || 0;
    const fine = data.fineAmount || 0;
    const discount = data.discountAmount || 0;
    const amountPaid = payable.amount + interest + fine - discount;

    return this.prisma.payable.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(data.paidAt),
        interestAmount: interest,
        fineAmount: fine,
        discountAmount: discount,
        amountPaid,
        receiptUrl: data.receiptUrl,
      },
    });
  }

  async getMetrics(condominiumId?: string) {
    const where = condominiumId ? { condominiumId } : {};
    
    const [totalPending, totalOverdue, totalPaid] = await Promise.all([
      this.prisma.payable.aggregate({
        where: { ...where, status: 'PENDING', dueDate: { gte: new Date() } },
        _sum: { amount: true },
      }),
      this.prisma.payable.aggregate({
        where: { ...where, status: 'PENDING', dueDate: { lt: new Date() } },
        _sum: { amount: true },
      }),
      this.prisma.payable.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amountPaid: true },
      }),
    ]);

    return {
      pending: totalPending._sum.amount || 0,
      overdue: totalOverdue._sum.amount || 0,
      paid: totalPaid._sum.amountPaid || 0,
    };
  }
}
