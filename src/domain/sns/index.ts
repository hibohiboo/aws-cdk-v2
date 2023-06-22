import { PublishCommand, SNSClient, SubscribeCommand } from "@aws-sdk/client-sns";
let snsClient: SNSClient | null = null;
const getSNSClinent = (region: string): SNSClient => {
  if (snsClient) return snsClient;
  snsClient = new SNSClient({ region });
  return snsClient
}

const sendEMailMessage = async (props: { region: string; account: string; snsTopic: string, subject: string, message: string }) => {

  const params = {
    TopicArn: `arn:aws:sns:${props.region}:${props.account}:${props.snsTopic}`,
    Subject: props.subject,
    Message: props.message
  };

  const snsClient = getSNSClinent(props.region)
  try {
    const data = await snsClient.send(new PublishCommand(params));
    console.log("Success.", data);
    return data; // For unit tests.
  } catch (err) {
    console.error("Error", err);
    throw err;
  }

}
export { sendEMailMessage };