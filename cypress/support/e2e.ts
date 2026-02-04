/**
 * Cypress E2E support file.
 * This file runs before every E2E test file.
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user.
       * @param email - User email
       * @param password - User password
       */
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

export {};
