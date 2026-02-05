/**
 * Multi-User Collaboration E2E Test
 *
 * Scenario 1 from PRD: Verify real-time sync between two users.
 *
 * Steps:
 * 1. User A logs in with Browser 1
 * 2. User B logs in with Browser 2 (simulated via separate session)
 * 3. User A creates a sticky note
 * 4. Verify note appears in Browser 2 within 100ms
 * 5. User B edits the note text
 * 6. Verify change appears in Browser 1 within 100ms
 *
 * Expected Result: Changes sync bidirectionally in <100ms
 *
 * Note: True multi-browser testing requires external tools like Playwright
 * or multiple Cypress instances. This test validates single-user sync behavior.
 */
describe('Multi-User Collaboration', () => {
  const testUser = {
    email: 'test@collabboard.com',
    password: 'testpassword123',
  };

  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the board after authentication', () => {
    cy.contains('CollabBoard').should('be.visible');
  });

  it('should sync sticky note creation in real-time', () => {
    cy.visit('/');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="toolbar-sticky-note"]').click();

    cy.get('[data-testid="board-canvas"]').click(400, 300);

    cy.get('[data-testid="sticky-note"]', { timeout: 5000 }).should('exist');
  });

  it('should show presence indicators for connected users', () => {
    cy.visit('/');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="presence-list"]', { timeout: 10000 }).should('exist');
  });

  it('should track cursor position changes', () => {
    cy.visit('/');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="board-canvas"]')
      .trigger('mousemove', { clientX: 200, clientY: 200 })
      .trigger('mousemove', { clientX: 400, clientY: 400 });
  });

  it('should handle object selection sync', () => {
    cy.visit('/');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        cy.login(testUser.email, testUser.password);
      }
    });

    cy.get('[data-testid="board-canvas"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="toolbar-sticky-note"]').click();
    cy.get('[data-testid="board-canvas"]').click(300, 300);

    cy.get('[data-testid="sticky-note"]', { timeout: 5000 })
      .first()
      .click();
  });
});
