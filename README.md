MyPlanner

Live: https://myplanner-ms.web.app

A task planner I built to get better at JavaScript and to have somewhere
to keep track of my own work. It started out saving to localStorage, but
I moved it to Firebase so my tasks would follow me between my laptop and
my phone.

What it does

-Add tasks with a category and due date, then edit or delete them
-Search your tasks and filter by category
-Progress bar that fills as you tick things off
-Light and dark mode

Installable as a PWA, so it runs like an app on mobile

Built with

Plain HTML, CSS and JavaScript, no frameworks. Firebase handles the
backend: Authentication for sign-in (Google and email/password),
Cloud Firestore for storing tasks, and Firebase Hosting for deployment.

I added both sign-in options because Google is quicker for most people,
but I didn't want to shut out anyone without a Google account.

Still to do

-Goals section alongside tasks
-Flag a task to pin it to the top of the list
-Recurring tasks
