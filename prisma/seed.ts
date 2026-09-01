import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando todas as tabelas do banco de dados...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.cashTransaction.deleteMany({});
  await prisma.investmentTransaction.deleteMany({});
  await prisma.fixedCost.deleteMany({});
  await prisma.cashRegister.deleteMany({});
  await prisma.storeSession.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.storeSettings.deleteMany({});
  await prisma.store.deleteMany({});

  console.log('✅ Dados anteriores limpos com sucesso.');

  const passSuper = await bcrypt.hash('admin123', 10);
  const passLoja = await bcrypt.hash('loja123', 10);

  // 1. Criar Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@admin.com',
      password: passSuper,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('👑 Super Admin criado:', superAdmin.email);

  // 2. Criar Loja Normal
  const store = await prisma.store.create({
    data: {
      subdomain: 'loja',
      title: 'Minha Loja Financeiro',
      adminEmail: 'loja@financeiro.com',
      printToken: 'PRT-LOJA1234',
    },
  });
  console.log('🏪 Loja Normal criada:', store.subdomain);

  // 3. Criar Usuário Admin da Loja Normal
  const storeAdmin = await prisma.user.create({
    data: {
      name: 'Administrador da Loja',
      email: 'loja@financeiro.com',
      password: passLoja,
      role: 'ADMIN',
      storeId: store.id,
    },
  });
  console.log('👤 Admin da Loja criado:', storeAdmin.email);

  // 4. Store Settings
  await prisma.storeSettings.create({
    data: {
      storeId: store.id,
      storeName: store.title,
      phone: '67999999999',
    },
  });

  // 5. Categoria Inicial
  const category = await prisma.category.create({
    data: {
      storeId: store.id,
      title: 'Geral',
      isVisible: true,
    },
  });

  // 6. Produto Exemplo
  await prisma.product.create({
    data: {
      storeId: store.id,
      title: 'Produto Exemplo',
      categoryId: category.id,
      price: 50.00,
      stock: 100,
    },
  });

  console.log('\n🚀 Usuários criados com sucesso!');
  console.log('----------------------------------------');
  console.log('👑 SUPER ADMIN:');
  console.log('   Email: admin@admin.com');
  console.log('   Senha: admin123');
  console.log('----------------------------------------');
  console.log('🏪 LOJA NORMAL:');
  console.log('   Email: loja@financeiro.com');
  console.log('   Senha: loja123');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
