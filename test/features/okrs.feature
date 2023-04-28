Feature: Objectives and Key Results

  Scenario: Creating an Objective
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I am on the Objectives page
    When I fill in "Maintain support happiness" and save
    Then I should see "Maintain support happiness" in the objectives list

  Scenario: Adding Key Results to Objectives from the Company page
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I have an objective called "Maintain support happiness" owned by "John Johnson" with a description of "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I am on the Objectives page
    When I click on the Add Targets link for the "Maintain support happiness" Objective
    And I fill in "Increase happiness score by 10% in Q2" target and save
    Then I should see "Increase happiness score by 10% in Q2" in the "Maintain support happiness" Objective key results

  Scenario: Creating a new profile and assigning as champion
    Given I am logged in as a user
    And I have an objective called "Maintain support happiness" with no owner
    And I am on the Objectives page
    When I click on the Champion link for the "Maintain support happiness" Objective
    And I click Add New profile
    And I fill in "Asara Utsuhashi" as the name
    And I fill in "Senior Software Engineer" as the title
    And I click on Save
    Then I should see "Asara Utsuhashi" as the champion of "Maintain support happiness"
