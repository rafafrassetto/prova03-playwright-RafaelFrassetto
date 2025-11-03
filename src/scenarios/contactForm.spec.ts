// Importamos 'Page' mas não precisamos mais de 'Request'
import { test, expect, Page } from '@playwright/test';
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
 * Preenche e envia. A página deve recarregar, limpando os campos.
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

  // Garante que os campos foram preenchidos antes de clicar
  await expect(contactPage.nameInput).toHaveValue(testData.name);

  // MUDANÇA: Trocamos 'waitForRequest' por 'waitForNavigation'
  // Isso espera o 'action="#"' recarregar a página.
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
 * Preenche e envia com IA. A página deve recarregar, limpando os campos.
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

  // Usamos a IA para preencher
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

  // MUDANÇA: Trocamos 'waitForRequest' por 'waitForNavigation'
  await Promise.all([
    page.waitForNavigation(),
    ai('Clique no botão "Enviar"', { page, test: test })
  ]);

  // Após o reload, os campos obrigatórios devem estar vazios
  await expect(contactPage.nameInput).toHaveValue('');
  await expect(contactPage.emailInput).toHaveValue('');
});

/**
 * TESTE 3: Playwright Padrão (Validação)
 * Tenta enviar vazio. A página NÃO deve recarregar.
 */
test('deve mostrar erro de validação ao tentar enviar campos obrigatórios vazios', async ({
  page
}: {
  page: Page;
}) => {
  // Preenchemos um campo só para ter certeza de que o teste é válido
  await contactPage.messageInput.fill('Teste de validação');
  
  // Tenta enviar (sem preencher 'nome' e 'email' que são required)
  await contactPage.submitForm();

  // A página NÃO deve recarregar, pois a validação HTML5 deve falhar
  await expect(page).toHaveURL(pageUrl);

  // Verificamos o 'validity state' do HTML5 no campo 'nome'
  const isNomeValid = await contactPage.nameInput.evaluate(
    el => (el as HTMLInputElement).validity.valid
  );
  expect(isNomeValid).toBe(false); // Esperamos que seja inválido

  // O campo que preenchemos deve continuar com o texto
  await expect(contactPage.messageInput).toHaveValue('Teste de validação');
});