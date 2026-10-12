import prisma from '../db/prisma.js';

const visibleStatuses = ['IN_CUSTODY', 'CLAIM_PENDING'];

const foundItemSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  brand: true,
  model: true,
  location: true,
  foundAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export class FoundItemServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'FoundItemServiceError';
    this.statusCode = statusCode;
  }
}

export async function createFoundItem(recordedById, data) {
  return prisma.foundItem.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      brand: data.brand ?? null,
      model: data.model ?? null,
      location: data.location,
      foundAt: data.foundAt ? new Date(data.foundAt) : null,
      recordedById,
    },
    select: foundItemSelect,
  });
}

export async function getFoundItems(filters) {
  const where = {
    status: {
      in: visibleStatuses,
    },
  };

  if (filters.category) {
    where.category = {
      equals: filters.category,
      mode: 'insensitive',
    };
  }

  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: 'insensitive',
    };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
      { brand: { contains: filters.search, mode: 'insensitive' } },
      { model: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.foundItem.findMany({
    where,
    select: foundItemSelect,
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });
}

export async function getFoundItemById(id) {
  return prisma.foundItem.findFirst({
    where: {
      id,
      status: {
        in: visibleStatuses,
      },
    },
    select: foundItemSelect,
  });
}

export async function updateFoundItem(id, data) {
  const item = await prisma.foundItem.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!item) {
    throw new FoundItemServiceError('Found item not found', 404);
  }

  // Keep record updates separate from claim/recovery status transitions.
  if (item.status !== 'IN_CUSTODY') {
    throw new FoundItemServiceError(
      'Only found items currently in custody can be edited',
      409
    );
  }

  return prisma.foundItem.update({
    where: { id },
    data: {
      ...data,
      ...(data.foundAt !== undefined
        ? {
            foundAt: data.foundAt ? new Date(data.foundAt) : null,
          }
        : {}),
    },
    select: foundItemSelect,
  });
}