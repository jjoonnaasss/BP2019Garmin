aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"27ATxlJB"}}' --update-expression 'SET UserID = :r, PWHash = :h' --expression-attribute-values file://test_values1.json

aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"27ATxlJB"}}' --update-expression 'SET UserID = :r REMOVE PWHash' --expression-attribute-values file://test_values2.json

aws dynamodb update-item --table-name UserData --key '{"Mail":{"S":"testMail"}}' --update-expression 'SET UserID = :r' --expression-attribute-values file://test_values2.json --condition-expression "attribute_exists(Mail)"
