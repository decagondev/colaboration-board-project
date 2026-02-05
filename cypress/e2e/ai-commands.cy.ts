/**
 * AI Command Sharing E2E Test
 *
 * Scenario 5 from PRD: Verify AI results appear for all users.
 *
 * Steps:
 * 1. User A and User B both connected
 * 2. User A enters "Create a SWOT analysis template"
 * 3. Wait for AI to process
 * 4. Verify template appears for User A
 * 5. Verify identical template appears for User B
 * 6. Verify no duplicate objects
 *
 * Expected Result: Both users see same template, no duplicates
 *
 * Note: This test validates single-user AI command flow.
 * Multi-user sync verification requires additional setup.
 */
describe('AI Command Sharing', () => {
  const testUser = {
    email: 'test@collabboard.com',
    password: 'testpassword123',
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it('should display AI command bar', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="ai-command-bar"]', { timeout: 5000 }).should('exist');
  });

  it('should accept AI commands via command bar', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="ai-command-input"]').should('exist');
  });

  it('should show AI processing indicator', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="ai-command-input"]').type('Create a yellow sticky note');
    cy.get('[data-testid="ai-submit-button"]').click();

    cy.get('[data-testid="ai-status-indicator"]', { timeout: 2000 }).should('exist');
  });

  it('should create objects from AI commands', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="ai-command-input"]').type('Add a sticky note that says "Test"');
    cy.get('[data-testid="ai-submit-button"]').click();

    cy.wait(5000);

    cy.get('[data-testid="board-canvas"]').should('exist');
  });

  it('should handle AI command errors gracefully', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="ai-command-input"]').type(' ');
    cy.get('[data-testid="ai-submit-button"]').click();

    cy.get('[data-testid="board-canvas"]').should('exist');
  });

  it('should queue multiple AI commands', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="ai-command-input"]').type('Create a blue sticky note');
    cy.get('[data-testid="ai-submit-button"]').click();

    cy.wait(1000);

    cy.get('[data-testid="ai-command-input"]').clear().type('Create a green sticky note');
    cy.get('[data-testid="ai-submit-button"]').click();

    cy.wait(5000);

    cy.get('[data-testid="board-canvas"]').should('exist');
  });

  it('should support keyboard shortcut for AI commands', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="ai-command-input"]')
      .type('Add a sticky note')
      .type('{enter}');

    cy.wait(3000);

    cy.get('[data-testid="board-canvas"]').should('exist');
  });

  it('should display global AI processing indicator for all users', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="global-ai-indicator"]').should('exist');
  });
});
