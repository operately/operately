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

  Scenario: Viewing an Objective
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I have an objective called "Maintain support happiness" owned by "John Johnson" with a description of "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I am on the Objectives page
    When I click on the "Maintain support happiness" Objective
    Then I should see "Maintain support happiness" in the Objective title
    And I should see "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers." in the Objective description
    And I should see "John Johnson" as the Objective owner

  Scenario: Viewing key results on an Objective
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I have an objective called "Maintain support happiness" owned by "John Johnson" with a description of "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I have a key result called "Increase happiness score by 10% in Q2" for the "Maintain support happiness" objective
    And I am on the "Maintain support happiness" Objective page
    Then I should see "Increase happiness score by 10% in Q2" in the "Maintain support happiness" Objective key results
    And I should see that "Increase happiness score by 10% in Q2" has status "pending"
