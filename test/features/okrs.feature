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
    And I click on Add
    Then I should see "Maintain support happiness" in the Objective title

  Scenario: Creating an Objective
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I have an objective called "Maintain support happiness" owned by "John Johnson"
    And I am on the Objectives page
    When I click on the "Maintain support happiness" Objective
    And I click Add Key Result
    And I set the name to "Maintain a happiness score of 95% or higher"
    And I set the description to "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I set the target to "95"
    And I take a screenshot
    And I click on Add
    Then I should see "Maintain a happiness score of 95% or higher" in the key results list
