Feature: Groups

  Scenario: List all groups
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    When I visit the groups page
    Then I should see "Marketing" in the list of groups

  Scenario: Create a new group
    Given I am logged in as a user
    When I create a new group with the name "Marketing"
    Then the new group "Marketing" is listing on the groups page

  Scenario: Adding Group Members
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    Given I have "Peter Swalowski" in my organization as the "Head of Support"
    When I visit the group "Marketing" page
    And I add the user "Peter Swalowski" to the group
    Then the user "PS" is visible on the group "Marketing" page

  Scenario: Setting group mission
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    When I visit the group "Marketing" page
    And I set the mission to "Let the world know about our product"
    Then the mission of the group "Marketing" is "Let the world know about our product"

  Scenario: Adding points of contact
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    When I visit the group "Marketing" page
    And I add a point of contact "Slack" with the value "#marketing-hq"
    Then the point of contact "#marketing-hq" is visible on the group "Marketing" page

  Scenario: Listing projects in a group
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    Given that a project with the name "Marketing Website" exists in the group "Marketing"
    When I visit the group "Marketing" page
    Then I should see "Marketing Website" in the list of projects

  Scenario: Listing objectives in a group
    Given I am logged in as a user
    Given that a group with the name "Marketing" exists
    Given that an objective with the name "Increase brand awareness" exists in the group "Marketing"
    When I visit the group "Marketing" page
    Then I should see "Increase brand awareness" in the list of objectives
