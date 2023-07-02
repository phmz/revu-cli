# Pipeline Integration

This guide will take you through the steps of integrating `revu` into your GitHub Actions pipeline.

## Prerequisites

Before you start, ensure that you have the following:

- Your OpenAI API key.
- A GitHub token.
- Optional: Ignore patterns for your GIT repository and temperature settings for your OpenAI model.

## Disclaimer

Please note that the following GitHub Action is set up to trigger a code review for **each commit** to a pull request. As such, frequent commits may lead to a large number of reviews, which in turn may result in higher usage of the OpenAI API and potentially increased costs. 

Moreover, while `revu` aims to provide helpful code reviews, it should not be used as the sole means of code review. Manual code reviews are still necessary to ensure the quality of code.

Always review the [OpenAI pricing](https://openai.com/pricing) before proceeding and adjust the workflow frequency based on your specific needs and resources. OpenAI and `revu` are not responsible for any charges you may incur.

## Steps

Here's a step-by-step guide on how to setup the GitHub Actions workflow:

### 1. Create a new GitHub Actions Workflow

Create a new file under `.github/workflows` in your repository. For instance, you might call it `code_review.yml`.

### 2. Configure your Workflow

Paste the following configuration into your new file and commit:

```yaml
name: Code Review

on:
  pull_request_target:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Node.js environment
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install revu-cli
        run: npm i -g revu-cli

      - name: Review PR
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GIT_IGNORE_PATTERNS: ${{ secrets.GIT_IGNORE_PATTERNS }}
          OPENAI_TEMPERATURE: ${{ secrets.OPENAI_TEMPERATURE }}
        run: |
          PR_NUMBER=${{ github.event.pull_request.number }}
          REPO=${{ github.repository }}
          revu pr $REPO $PR_NUMBER > output.txt

      - name: Set output
        id: output
        run: |
          echo "OUTPUT<<EOF" >> $GITHUB_ENV
          cat output.txt >> $GITHUB_ENV
          echo "EOF" >> $GITHUB_ENV

      - name: Create PR comment
        uses: actions/github-script@v6
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            const output = process.env.OUTPUT
            const issue_number = context.issue.number
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issue_number,
              body: output,
            })
```

### 3. Setup Secrets

Navigate to your GitHub repository and click on the `Settings` tab. Then, go to the `Secrets` section and add the following secrets:

- `OPENAI_API_KEY`: Your OpenAI API key.
- `GITHUB_TOKEN`: Your GitHub token.
- Optional: `GIT_IGNORE_PATTERNS`: Any file patterns to ignore during review.
- Optional: `OPENAI_TEMPERATURE`: The temperature setting for your OpenAI model.

### 4. Save Changes

Commit and push your changes to the repository

## Test the Workflow

You can test the workflow by creating a new pull request in your repository. GitHub Actions will automatically trigger the `Code Review` workflow. When the workflow completes, a comment with the output from `revu` should be posted on the pull request.

## Troubleshooting

If you run into issues while setting up the workflow, check the GitHub Actions run logs for any error messages. This should give you an idea of what's going wrong. If you continue to encounter problems, consider asking for help by submitting an issue.
