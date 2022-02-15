# Get Owners Github Action

Do you want to have all the approvers and reviewers without having strange scripts in your actions? 
Do you want to have random reviewers? 
This seems the action you need

GitHub Action
-----------------------------

```yaml
on: [push, pull_request_target]

jobs:
  test_get_owners_action:
    runs-on: ubuntu-latest
    name: Test
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Parse OWNERS
        id: owners
        uses: upalatucci/get-owners-action@v2.1
        with:
          owners-path: './test/OWNERS'
          n-random-reviewers: 2
          auto-add-reviewers: true
          token: ${{ secrets.GITHUB_TOKEN }}
      - name: Get approvers
        run: echo "The Approvers are ${{ steps.owners.outputs.approvers }}"
      - name: Get reviewers
        run: echo "The Reviewers are ${{ steps.owners.outputs.reviewers }}"
      - name: Get random reviewers
        run: echo "The Random reviewers are ${{ steps.owners.outputs.random-reviewers }}"
```


Input Parameters
--------------------------
You can set any or all of the following input parameters:

|Name                     |Type    |Required? |Default                     |Description
|-------------------------|--------|----------|----------------------------|------------------------------------
|`owners-path`            |string  |no        |OWNERS                      |OWNERS file path including the actual file name
|`n-random-reviewers`     |number  |no        |                            |If you want, the action can expose also random reviewers
|`auto-add-reviewers`     |boolean |no        |false                       |Should add the random reviewers to pr automatically. Ignored if pr not found
|`token`                  |string  |no        |                            |Secret Token to add Reviewers ( could also be provided using the env GITHUB_TOKEN )


Output Variables
--------------------------

|Variable           |Type      |Description
|-------------------|----------|------------------------------------
|`approvers`        |string[]  |All the approvers in the OWNERS file
|`reviewers`        |string[]  |All the reviewers in the OWNERS file
|`random-reviewers` |string[]  |Random reviewers excluding sender
