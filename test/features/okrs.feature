Feature: Objectives and Key Results

  Scenario: Creating an Objective
    Given I am logged in as a user
    And I am on the Objectives page
    When I click on the "Add Objective" button
    And I fill in the Objective Name field with "Maintain support happiness"
    And I fill in the Objective Description field with "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I choose "Current quarter" from the Timeframe dropdown
    And I click on the "Add" button
    Then I should see "Maintain support happiness" in the Objective title

  Scenario: Creating an Objective
    Given I am logged in as a user
    And I have an objective called "Maintain support happiness"
    And I am on the Objectives page
    And I take a screenshot
    When I click on the "Maintain support happiness" Objective
    And I click on the "Add Key Result" button
    And I fill in the Name field with "Maintain a happiness score of 95% or higher"
    And I fill in the Description field with "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I click on the "Add" button
    Then I should see "Maintain a happiness score of 95% or higher" in the Key Result title

