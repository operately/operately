Feature: Objectives and Key Results

  Scenario: Creating an Objective
    Given I am logged in as a user
    And I am on the Objectives page
    When I click on the Create Objective button
    And I fill in the Objective Name field with "Maintain support happiness"
    And I fill in the Objective Description field with "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I choose "Current quarter" from the Timeframe dropdown
    And I click on the Create Objective and results button
    And I add a Key Result with the name "Happiness score increased from 95 to 97" and the target value "above" "97"
    And I add a Key Result with the name "First response time dropped from 2 hours to 1 hour" and the target value "below" "1 hour"
    Then I should see "Maintain support happiness" in the list of Objectives

  # Scenario: Viewing Objectives and Key Results
  #   Given I am logged in as a user
  #   And I am on the Objectives page
  #   When I view the list of Objectives and Key Results
  #   Then I should see a list of all Objectives and their associated Key Results
  #   And I should be able to click on an Objective to view its details
