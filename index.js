/**
 * https://probot.github.io/api/7.0.1/interfaces/githubapi.html
 */
/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
var getWeek = require('date-fns/getWeek')
var axios = require('axios');

const DEFAULT_PROJECT_COLUMN_ID = 8793542

const ADDED_LABEL_COLLECTOR_URL = "https://hooks.zapier.com/hooks/catch/3058207/ozdfbnq"

const ON_ISSUE_CLOSED_URL = "https://prod-00.francecentral.logic.azure.com:443/workflows/39d404521db842eaad3fd8d06474ce7a/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OtSf9vzDXoWznKZJpuFNzvLe91bgp9gfPpzNU0XOiNw" 


//* Documentation Of the Issue 
//https://docs.github.com/en/rest/reference/issues
//

module.exports = app => {
  // Your code here

  app.log('Yay, the app was loaded!')
  app.on('issues.opened', async context => {
    const milestones = await context.github.issues.listMilestonesForRepo({
      owner: 'Mailoop',
      repo: 'app',
    })
    const issue_number = context.payload.issue.number
    const issue_id = context.payload.issue.id


    const currentWeekNumber = getWeek(new Date(), { weekStartsOn: 1, firstWeekContainsDate: 4 })
    const weekExpression = `n°${currentWeekNumber}`
    const current_milestone = milestones.data.filter(milestone => milestone.title.match(weekExpression))[0]
    context.github.issues.update({
      owner: "Mailoop",
      repo: "app",
      issue_number: issue_number,
      milestone: current_milestone.number,
    })

    context.github.projects.createCard({
      column_id: DEFAULT_PROJECT_COLUMN_ID,
      content_type: "Issue",
      content_id: issue_id,
    });

  })

  app.on('issues.closed', async context => {
    await axios.post(ON_ISSUE_CLOSED_URL, {
      issue_number: context.payload.issue.number
    })
  })

  app.on('issues.labeled', async context => {
    await axios.post(ADDED_LABEL_COLLECTOR_URL, context.payload)
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
