##########################################################################
#
# pgAdmin 4 - PostgreSQL Tools
#
# Copyright (C) 2013 - 2023, The pgAdmin Development Team
# This software is released under the PostgreSQL Licence
#
#########################################################################

"""This file contains functions fetching different utility paths."""

import os

from flask import current_app, url_for
from flask_security import current_user
from werkzeug.exceptions import InternalServerError
from pgadmin.utils.constants import MY_STORAGE


def get_storage_directory(user=current_user, shared_storage=''):
    import config
    if config.SERVER_MODE is not True:
        return None

    is_shared_storage = False
    if shared_storage != MY_STORAGE and shared_storage:
        is_shared_storage = True
        selectedDir = [sdir for sdir in config.SHARED_STORAGE if
                       sdir['name'] == shared_storage]
        storage_dir = None
        if len(selectedDir) > 0:
            the_dir = selectedDir[0]['path']
            storage_dir = the_dir
    else:
        storage_dir = getattr(
            config, 'STORAGE_DIR',
            os.path.join(
                os.path.realpath(
                    os.path.expanduser('~/.pgadmin/')
                ), 'storage'
            )
        )

    if storage_dir is None:
        return None

    def _preprocess_username(un):
        ret_un = un
        if len(ret_un) == 0 or ret_un[0].isdigit():
            ret_un = 'pga_user_' + un

        ret_un = ret_un.replace('@', '_')\
            .replace('/', 'slash')\
            .replace('\\', 'slash')

        return ret_un

    username = _preprocess_username(user.username.split('@')[0])

    # Figure out the old-style storage directory name
    old_storage_dir = os.path.join(
        storage_dir.decode('utf-8') if hasattr(storage_dir, 'decode')
        else storage_dir,
        username
    )

    username = _preprocess_username(user.username)

    if is_shared_storage:
        # Figure out the new style storage directory name
        storage_dir = os.path.join(
            storage_dir.decode('utf-8') if hasattr(storage_dir, 'decode')
            else storage_dir
        )
    else:
        # Figure out the new style storage directory name
        storage_dir = os.path.join(
            storage_dir.decode('utf-8') if hasattr(storage_dir, 'decode')
            else storage_dir,
            username
        )

    # Rename an old-style storage directory, if the new style doesn't exist
    if os.path.exists(old_storage_dir) and not os.path.exists(storage_dir):
        current_app.logger.warning(
            'Renaming storage directory %s to %s.',
            old_storage_dir, storage_dir
        )
        os.rename(old_storage_dir, storage_dir)

    if not os.path.exists(storage_dir):
        os.makedirs(storage_dir, int('700', 8))

    return storage_dir


def init_app():
    import config
    if config.SERVER_MODE is not True:
        return None

    storage_dir = getattr(
        config, 'STORAGE_DIR',
        os.path.join(
            os.path.realpath(
                os.path.expanduser('~/.pgadmin/')
            ), 'storage'
        )
    )

    if storage_dir and not os.path.isdir(storage_dir):
        if os.path.exists(storage_dir):
            raise InternalServerError(
                'The path specified for the storage directory is not a '
                'directory.'
            )
        os.makedirs(storage_dir, int('700', 8))

    if storage_dir and not os.access(storage_dir, os.W_OK | os.R_OK):
        raise InternalServerError(
            'The user does not have permission to read and write to the '
            'specified storage directory.'
        )


def get_cookie_path():
    cookie_root_path = '/'
    pgadmin_root_path = url_for('browser.index')
    if pgadmin_root_path != '/browser/':
        cookie_root_path = pgadmin_root_path.replace(
            '/browser/', ''
        )
    return cookie_root_path
