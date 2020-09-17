from app.api.models.Base import Base
from app.api.utils.remoteImageMapper import remoteImagesList

from app.lib.conf import Config
from app import __metadata__ as meta

from pylxd import Client
import requests
import logging

import os
import os.path
from collections import namedtuple
CertRemotePaessler = namedtuple('Cert', ['cert', 'key'])  # pragma: no cover


logging = logging.getLogger(__name__)

class LXDModule(Base):
    # Default 127.0.0.1 -> Move to Config
    def __init__(self, remoteHost='127.0.0.1'):
        logging.info('Accessing PyLXD client')
        verify = False

        if Config().get(meta.APP_NAME, '{}.lxd.remote.enable'.format(meta.APP_NAME.lower())) == 'true':
            try:
                remoteHost = Config().get(meta.APP_NAME, '{}.lxd.remote'.format(meta.APP_NAME.lower()))
                verify = False if Config().get(meta.APP_NAME, '{}.lxd.sslverify'.format(meta.APP_NAME.lower())) == 'false' else True
            except:
                pass
            self.client = Client(endpoint=remoteHost, verify=False, cert=None)
        else:
            self.client = Client(verify=False)


    def listContainers(self):
        try:
            logging.info('Reading container list')
            return self.client.containers.all()
        except Exception as e:
            logging.error('Failed to read container list: ')
            logging.exception(e)
            raise ValueError(e)

    def listLocalImages(self):
        try:
            logging.info('Reading local image list')
            results = []
            for image in self.client.api.images.get().json()['metadata']:
                results.append(self.client.api.images[image.split('/')[-1]].get().json()['metadata'])

            return results
        except Exception as e:
            logging.error('Failed to read local image list: ')
            logging.exception(e)
            raise ValueError(e)

    def listRemoteImages(self):
        try:
            remoteImagesLink = Config().get(meta.APP_NAME, '{}.images.remote'.format(meta.APP_NAME.lower()))
            logging.info('Reading remote image list')
            remoteClient = Client(endpoint=remoteImagesLink)
            return remoteImagesList(remoteClient.api.images.aliases.get().json())
        except Exception as e:
            logging.error('Failed to get remote container images: ')
            logging.exception(e)
            raise ValueError(e)

    def listRemotePaesslerImages(self):
        try:
            remotePaesslerImagesLink = Config().get(meta.APP_NAME, '{}.images.remote-paessler'.format(meta.APP_NAME.lower()))
            logging.info('Reading remote image list')
            verify = False if Config().get(meta.APP_NAME, '{}.lxd.sslverify'.format(meta.APP_NAME.lower())) == 'false' else True
            CERTS_PATH = Config().get(meta.APP_NAME, '{}.conf.dir'.format(meta.APP_NAME.lower()))
            cert = CertRemotePaessler(
                cert=os.path.expanduser(os.path.join('/Users/njafri/Documents/Work/GatewayPoC/lxdui/conf', 'client.crt')),
                key=os.path.expanduser(os.path.join('/Users/njafri/Documents/Work/GatewayPoC/lxdui/conf', 'client.key'))
            )
            remoteClient = Client(endpoint=remotePaesslerImagesLink, verify=False, cert=cert)
            return remoteImagesList(remoteClient.api.images.aliases.get().json())
        except Exception as e:
            logging.error('Failed to get remote container images: ')
            logging.exception(e)
            raise ValueError(e)

    def listNightlyImages(self):
        try:
            logging.info('Reading nightly remote image list')
            images = requests.get(url='https://vhajdari.github.io/lxd-images/images.json')
            return images.json()['images']
        except Exception as e:
            logging.error('Failed to get remote nightly container images: ')
            logging.exception(e)
            raise ValueError(e)

    def detailsRemoteImage(self, alias):
        try:
            remoteImagesLink = Config().get(meta.APP_NAME, '{}.images.remote'.format(meta.APP_NAME.lower()))
            remoteClient = Client(endpoint=remoteImagesLink)
            fingerprint = remoteClient.api.images.aliases[alias].get().json()['metadata']['target']
            return remoteClient.api.images[fingerprint].get().json()['metadata']
        except Exception as e:
            raise ValueError(e)

    def detailsRemotePaesslerImage(self, alias):
        try:
            remotePaesslerImagesLink = Config().get(meta.APP_NAME, '{}.images.remote-paessler'.format(meta.APP_NAME.lower()))
            verify = False if Config().get(meta.APP_NAME, '{}.lxd.sslverify'.format(meta.APP_NAME.lower())) == 'false' else True
            remoteClient = Client(endpoint=remotePaesslerImagesLink, verify=False)
            fingerprint = remoteClient.api.images.aliases[alias].get().json()['metadata']['target']
            return remoteClient.api.images[fingerprint].get().json()['metadata']
        except Exception as e:
            raise ValueError(e)


    def downloadImage(self, image):
        try:
            remoteImagesLink = Config().get(meta.APP_NAME, '{}.images.remote'.format(meta.APP_NAME.lower()))
            logging.info('Downloading remote image:', image)
            remoteClient = Client(endpoint=remoteImagesLink)
            try:
                remoteImage = remoteClient.images.get_by_alias(image)
            except:
                remoteImage = remoteClient.images.get(image)
            newImage = remoteImage.copy(self.client, auto_update=False, public=False, wait=True)
            return self.client.api.images[newImage.fingerprint].get().json()['metadata']
        except Exception as e:
            logging.error('Failed to download image:')
            logging.exception(e)
            raise ValueError(e)

    def downloadPaesslerImage(self, image):
        try:
            remotePaesslerImagesLink = Config().get(meta.APP_NAME, '{}.images.remote-paessler'.format(meta.APP_NAME.lower()))
            logging.info('Downloading remote image:', image)
            verify = False if Config().get(meta.APP_NAME,'{}.lxd.sslverify'.format(meta.APP_NAME.lower())) == 'false' else True
            remoteClient = Client(endpoint=remotePaesslerImagesLink, verify=False)
            try:
                remoteImage = remoteClient.images.get_by_alias(image)
            except:
                remoteImage = remoteClient.images.get(image)
            newImage = remoteImage.copy(self.client, auto_update=False, public=False, wait=True)
            return self.client.api.images[newImage.fingerprint].get().json()['metadata']
        except Exception as e:
            logging.error('Failed to download image:')
            logging.exception(e)
            raise ValueError(e)

    def deleteImage(self):
        pass

    def listProfiles(self):
        try:
            results = []
            for profile in self.client.api.profiles.get().json()['metadata']:
                results.append(self.client.api.profiles[profile.split('/')[-1]].get().json()['metadata'])

            return results
        except Exception as e:
            raise ValueError(e)

    def listStoragePools(self):
        try:
            results = []
            for profile in self.client.api.storage_pools.get().json()['metadata']:
                results.append(self.client.api.storage_pools[profile.split('/')[-1]].get().json()['metadata'])

            return results
        except Exception as e:
            raise ValueError(e)

    def createProfile(self):
        pass

    def deleteProfile(self):
        pass

    def updateProfile(self):
        pass

    def listNetworks(self):
        try:
            logging.info('Retrieving network list.')
            results = []
            for network in self.client.api.networks.get().json()['metadata']:
                results.append(self.client.api.networks[network.split('/')[-1]].get().json()['metadata'])

            return results
        except Exception as e:
            logging.error('Failed to retrieve network list:')
            logging.exception(e)
            raise ValueError(e)

    def createNetwork(self):
        pass

    def deleteNetwork(self):
        pass

    def updateNetwork(self):
        pass


    def config(self):
        try:
            return self.client.api.get().json()['metadata']
        except Exception as e:
            raise ValueError(e)

    def hasImage(self, imageInfo):
        lxdModule = LXDModule()
        for image in lxdModule.listLocalImages():
            if image.get('fingerprint') == imageInfo:
                return 'fingerprint'
            for alias in image.get('aliases'):
                if alias.get('name') == imageInfo:
                    return 'alias'
        return None

    def containerExists(self, containerName):
        lxdModule = LXDModule()
        try:
            logging.info('Checking if container exists.')
            container = self.client.containers.get(containerName)
            return True
        except Exception as e:
            logging.error('Failed to verify container:')
            logging.exception(e)
            return False

    def info(self):
        raise NotImplementedError()

    def create(self):
        raise NotImplementedError()

    def delete(self):
        raise NotImplementedError()

    def start(self):
        raise NotImplementedError()

    def stop(self):
        raise NotImplementedError()

    def restart(self):
        raise NotImplementedError()

    def update(self):
        raise NotImplementedError()

    def move(self):
        raise NotImplementedError()

    def clone(self):
        raise NotImplementedError()

    def snapshot(self):
        raise NotImplementedError()

