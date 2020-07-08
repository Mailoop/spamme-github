/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
var getWeekYear = require('date-fns/getWeekYear')

module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')
  app.on('issues.opened', async context => {
    app.log("Milestone", Object.keys(context.github.issues).sort())
    const milestones = await context.github.issues.listMilestonesForRepo({
      owner: 'Mailoop',
      repo: 'app',
    })
    const currentWeekNumber = getWeekYear(new Date())
    current_milestone = milestones.filter(milestone => milestone.title.match(currentWeekNumber))
    app.log("Milestone", current_milestone)

  })

  app.on('issue_comment', async context => {
    const comment = context.payload.comment
    const action = context.payload.action
    const issue = context.payload.issue
    if (action == 'deleted') {
      return ;
    }
    const body =  comment.body
    app.log("payload", context.payload)
    const matchSplit = body.match(new RegExp("@spamee")) && body.match(new RegExp("--split"))

    if (comment.user.type == "User" && matchSplit) {
      const newIssueName = body.replace("@spamee", "").replace("--split", "")
      await context.github.issues.create({
        owner: "Mailoop",
        repo: "app",
        labels: issue.labels,
        title: newIssueName,
        body: `Created By Spamme 🎉
        Spliting of : ${issue.title} ${issue.html_url}
        `
      })

      app.log("body", comment.body)
      const answerBody = `Spliting Done 👍`

      const issueComment = context.issue({ body: answerBody })
      return context.github.issues.createComment(issueComment)
    }
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
