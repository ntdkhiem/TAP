# Khiem Test Assistant Project

## Description/Purpose:
- To notify me when a student or students are struggling and in what way I can help
- Should change its response depending on if there’s one or multiple students
- Should track if a student doesn’t answer a question, takes too long to answer, or answers incorrectly
- The goal is to prevent students from falling behind without me noticing

## MVP

### TUTORS:
- There should be an initial page only a tutor can see where they can upload a set of questions (can be one format or multiple like a pdf or excel)
- They should be able to preview the questions if they’d like and scroll through (all math expression should have proper latex displayed)
- Ideally the questions should allow for images for each one
- Once the tutor uploads and submits they should be taken to a waiting room where they have a class code they can share with students, they can see all the students who joined, and they should have an option to get started

### Students:
- A student clicking on the link should only see an option to enter a class code
- When they do there should be some indication that it worked and that they’re in the right class
- When the tutor clicks to start all the questions should pop up for them to answer
- It can be multiple choice but it should allow images to be displayed. Math needs LaTeX rendering as well
- Allows them to go through and answer at their own pace

### Tutor:
- When all the students join and they click to get started, the page should allow the tutor to find where a specific student is struggling, in what way, and suggestions on how to approach them
- There should also be some sort of display that updates periodically, like a queue, with new insights for multiple or all the students at once (this can happen while students are answering questions or after)
- When finished, give an option to start a new test with the same group and allow the teacher to upload more questions

### Some more requirements:
- Basic testing
- Uses built-in authentication already setup for website
- Error and edge case handling

### Tech stack:
- NextJs frontend
- Supabase backend
- Gemini AI

