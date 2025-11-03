import { test, expect, Page, Request } from '@playwright/test';
import { ai } from '@zerostep/playwright';

import { faker } from '@faker-js/faker';
import ContactPage from '../support/pages/ContactPage';

let contactPage: ContactPage;
const pageUrl =
  'https://techshop.wuaze.com/resources/views/RafaelFrassettoPereira-JoaoGabrielRosso-JoaoAcordi-LuizMiguel-Apresentacao-A3.html?i=1';

test.beforeEach(async ({ page }: { page: Page }) => {
  contactPage = new ContactPage(page);

  await contactPage.visit();
  await expect(page).toHaveTitle('Formulário de Contato');
});

/**
 * TESTE 1: Playwright Padrão (Happy Path)
 * 
 */
test('deve preencher e enviar o formulário com sucesso (Playwright Padrão)', async ({
  page
}: {
  page: Page;
}) => {
  const testData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: faker.lorem.sentence(5),
    message: faker.lorem.paragraph()
  };

  await contactPage.fillContactForm(
    testData.name,
    testData.email,
    testData.subject,
    testData.message
  );

  // Espera a página recarregar (mudar a URL)
  await Promise.all([
    page.waitForNavigation(),
    contactPage.submitForm()
  ]);

  // Após o reload, os campos obrigatórios devem estar vazios
  await expect(contactPage.nameInput).toHaveValue('');
  await expect(contactPage.emailInput).toHaveValue('');
});

/**
 * TESTE 2: Zerostep AI
 * 
 */
test('deve preencher e enviar o formulário com sucesso (Zerostep AI)', async ({
  page
}: {
  page: Page;
}) => {
  const testData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: 'Teste de Assunto via AI',
    message: 'Esta é uma mensagem de teste enviada pela Zerostep AI.'
  };

  // 'test: test' para a função 'ai'
  await ai(`Preencha o campo "Nome Completo" com "${testData.name}"`, { page, test: test });
  await ai(`Preencha o campo "Seu Melhor Email" com "${testData.email}"`, {
    page,
    test: test
  });
  await ai(`Preencha o campo "Assunto" com "${testData.subject}"`, { page, test: test });
  await ai(`Preencha o campo "Mensagem" com "${testData.message}"`, {
    page,
    test: test
  });

  // Espera a página recarregar (mudar a URL)
  await Promise.all([
    page.waitForNavigation(),
    ai('Clique no botão "Enviar"', { page, test: test })
  ]);

  // Após o reload, os campos obrigatórios devem estar vazios
  await expect(contactPage.nameInput).toHaveValue('');
  await expect(contactPage.emailInput).toHaveValue('');
});

/**
 * TESTE 3: Playwright Padrão (Verificação de Texto)
 * Verifica se os elementos da página (título e labels) têm o texto correto.
 */
test('deve exibir os labels corretos para os campos', async ({
  page
}: {
  page: Page;
}) => {
  // Verifica o título H1
  await expect(page.locator('h1')).toHaveText('Formulário de Contato');
  
  // Verifica os labels
  await expect(page.locator('label[for="nome"]')).toHaveText('Nome Completo:');
  await expect(page.locator('label[for="email"]')).toHaveText('Seu Melhor Email:');
  await expect(page.locator('label[for="assunto"]')).toHaveText('Assunto:');
  await expect(page.locator('label[for="mensagem"]')).toHaveText('Mensagem:');
});