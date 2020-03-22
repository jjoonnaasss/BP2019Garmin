aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"testMail"}}' \
--update-expression 'SET UserID = :r, PWHash = :h' --expression-attribute-values file://test_values1.json

aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"testMail"}}' \
--update-expression 'SET UserID = :r REMOVE PWHash' --expression-attribute-values file://test_values2.json

aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"testMail"}}' \
--update-expression 'SET UserID = :r' --expression-attribute-values file://test_values2.json \
--condition-expression "attribute_exists(Mail)"

# Password reset

aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"testMail"}}' \
--expression-attribute-names '{"#TS": "TimeStamp"}' \
--update-expression 'SET #TS = :t, RandomValue = :r' --expression-attribute-values file://reset1.json

aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"testMail"}}' \
--expression-attribute-names '{"#TS": "TimeStamp"}' \
--expression-attribute-values '{":h": {"S": "newHash"}}' \
--update-expression 'SET PWHash = :h REMOVE RandomValue, #TS' 