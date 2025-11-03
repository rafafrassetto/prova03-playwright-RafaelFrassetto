import { Page, Locator } from '@playwright/test';
import BasePage from './BasePage';

export default class ContactPage extends BasePage {
  // Locators
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectInput: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;

  // URL do seu site
  readonly pageUrl =
    'https://techshop.wuaze.com/resources/views/RafaelFrassettoPereira-JoaoGabrielRosso-JoaoAcordi-LuizMiguel-Apresentacao-A3.html?i=1';

  constructor(readonly page: Page) {
    super(page);

    // Mapeamento dos elementos usando os IDs do seu HTML
    this.nameInput = this.page.locator('#nome');
    this.emailInput = this.page.locator('#email');
    this.subjectInput = this.page.locator('#assunto');
    this.messageInput = this.page.locator('#mensagem');
    this.submitButton = this.page.locator('.submit-button');
  }

  /**
   * Navega para a página do formulário de contato
   */
  async visit(): Promise<void> {
    await this.page.goto(this.pageUrl);
  }

  /**
   * Preenche o formulário de contato com dados
   */
  async fillContactForm(
    name: string,
    email: string,
    subject: string,
    message: string
  ): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.subjectInput.fill(subject);
    await this.messageInput.fill(message);
  }

  /**
   * Clica no botão de enviar
   */
  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }
}