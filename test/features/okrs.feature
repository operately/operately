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
    And I should see that "Increase happiness score by 10% in Q2" has status "PENDING"

  Scenario: Viewing ongoing projects on an Objective
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I have "Asara Utsuhashi" in my organization as the "Senior Software Engineer"
    And I have an objective called "Maintain support happiness" owned by "John Johnson" with a description of "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I have a project called "Live Support Chat" for the "Maintain support happiness" objective championed by "Asara Utsuhashi"
    And I am on the "Maintain support happiness" Objective page
    Then I should see "Live Support Chat" in the "Maintain support happiness" Objective projects
    And I should see that "Asara Utsuhashi" is the champion of "Live Support Chat"

  Scenario: Posting updates
    Given I am logged in as a user
    And I have "John Johnson" in my organization as the "Head of Support"
    And I have "Asara Utsuhashi" in my organization as the "Senior Software Engineer"
    And I have an objective called "Maintain support happiness" owned by "John Johnson" with a description of "The happiness score is a measure of how happy our customers are with our support. We want to maintain a score of 95% or higher in order to live up to our core tenant which states that we focus on delighting customers."
    And I am on the "Maintain support happiness" Objective page
    When I fill in the Update field with "We are currently working on a live support chat feature. We hope to have it ready by the end of the quarter."
    And I click on Post Update
    Then I should see "We are currently working on a live support chat feature. We hope to have it ready by the end of the quarter." in the Objective updates
