from sklearn.model_selection import train_test_split


issue_model_column_list = ['titleLength', 'bodyLength', 'commentsNum','issueTitle','issueBody',
                           'commentsTotalLength',
                           'participantsNum', 'assigneesNum', 'creatorCreated', 'creatorFollowers',
                           'starNum',
                           'openIssuesNum', 'hasOrganization', 'isGoodForFreshman']

_train_prop_list = ['titleLength', 'bodyLength', 'commentsNum','titleReadability','bodyReadability',
                           'titleTopicProbability','bodyTopicProbability',
                           'titleTopic','bodyTopic',
                           'commentsTotalLength',
                           'participantsNum', 'assigneesNum', 'creatorCreated', 'creatorFollowers',
                           'starNum',
                           'openIssuesNum', 'hasOrganization', 'isGoodForFreshman']

train_prop_list = ['titleLength', 'bodyLength', 'commentsNum','bodyReadability',
                           'bodyTopicProbability'
                           ,'bodyTopic',
                           'commentsTotalLength',
                           'participantsNum', 'creatorCreated', 'creatorFollowers',
                           'starNum',
                           'openIssuesNum', 'hasOrganization', 'isGoodForFreshman']
gfh_prod_server_url = 'http://api.mengxun.online/gfh'
gfh_local_server_url = 'http://localhost:10310'
qiniu_bucket_url = 'http://cdn-gfh.zerokirin.online'
