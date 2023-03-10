Feature: Projects

  Scenario: Create a new project
    Given I am logged in as a user
    When I go to the projects page
    When I click on the "New Project" button
    And I fill in the "Name" field with "Alpha version of Operately"
    And I fill in the "Description" field with "This is the first version of Operately"
    And I click on the "Save Project" button
    Then I should see the project "Alpha version of Operately" in the list of projects
