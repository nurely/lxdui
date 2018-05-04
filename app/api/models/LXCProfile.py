from app.api.models.LXDModule import LXDModule
from pylxd import Client
import logging

logging = logging.getLogger(__name__)

class LXCProfile(LXDModule):

    def __init__(self, input):
        logging.info('Connecting to LXD')
        self.client = Client()
        self.input = input

    def info(self):
        try:
            return self.client.api.profiles[self.input.get('name')].get().json()['metadata']
        except Exception as e:
            raise ValueError(e)

    def info(self, name):
        try:
            logging.info('Reading profile {} information'.format(name))
            return self.client.api.profiles[name].get().json()['metadata']
        except Exception as e:
            logging.error('Failed to retrieve information for profile {}'.format(name))
            logging.exception(e)
            raise ValueError(e)

    def createProfile(self):
        try:
            logging.info('Creating profile {}'.format(self.input.get('name')))
            self.client.profiles.create(self.input.get('name'), config=self.input.get('config'),
                                        devices=self.input.get('devices'))

            return self.client.api.profiles[self.input.get('name')].get().json()['metadata']
        except Exception as e:
            logging.error('Failed to create container {}'.format(self.input.get('name')))
            logging.exception(e)
            raise ValueError(e)

    def deleteProfile(self):
        try:
            logging.info('Deleting profile {}'.format(self.input.get('name')))
            return self.client.api.profiles[self.input.get('name')].delete(json=self.input).json()
        except Exception as e:
            logging.error('Failed to delete profile {}'.format(self.input.get('name')))
            logging.exception(e)
            raise ValueError(e)

    def updateProfile(self):
        try:
            logging.info('Updating profile {}'.format(self.input.get('name')))
            self.client.api.profiles[self.input.get('name')].put(json=self.input).json()['metadata']
            if self.input.get('new_name'):
                return self.rename()
            return self.info()
        except Exception as e:
            logging.error('Failed to update profile {}'.format(self.input.get('name')))
            logging.exception(e)
            raise ValueError(e)

    def rename(self):
        try:
            logging.info('Renaming profile {}'.format(self.input.get('name')))
            profile = self.client.profiles.get(self.input.get('name'))
            profile.rename(self.input.get('new_name'))
            return self.info(self.input.get('new_name'))
        except Exception as e:
            logging.error('Failed to rename profile {}'.format(self.input.get('name')))
            logging.exception(e)
            raise ValueError(e)
