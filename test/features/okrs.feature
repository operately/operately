Feature: Objectives and Key Results

  Scenario: Creating an Objective
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I am on the Objectives page
    When I click on Add Objective
    And I fill in the Objective Name field with "Maintain support happiness"
    And I fill in the Objective Description field with "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I choose "Current quarter" from the Timeframe dropdown
    And I choose "John Johnson" from the Owner dropdown
    And I click on Save
    Then I should see "Maintain support happiness" in the Objective title
