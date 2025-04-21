outgoing_system_prompt = 'Act a top sales person'

outgoing_user_prompt = '''
Write an initial sales email to {first_name} {last_name}. Your goal is {campaign_goal}.

Do not include subject line or signature, only the body of the email.
'''
reply_system_prompt = 'Act a top sales person'
reply_user_prompt = '''
Write a reply to the email below. Your goal is {campaign_goal}.

Reply to this email: {last_message}.
Message thread: {thread}.
Use this additional info to construct your message: {retrieved_info}
'''