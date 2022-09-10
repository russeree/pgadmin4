/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - PostgreSQL Tools
//
// Copyright (C) 2013 - 2022, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

import { getNodeListByName } from '../../../../../../../../static/js/node_ajax';
import UserMappingSchema from './user_mapping.ui';
import _ from 'lodash';

define('pgadmin.node.user_mapping', [
  'sources/gettext', 'sources/url_for',
  'sources/pgadmin', 'pgadmin.browser',
  'pgadmin.browser.collection',
], function(gettext, url_for, pgAdmin, pgBrowser) {

  // Extend the browser's collection class for user mapping collection
  if (!pgBrowser.Nodes['coll-user_mapping']) {
    pgAdmin.Browser.Nodes['coll-user_mapping'] =
      pgAdmin.Browser.Collection.extend({
        node: 'user_mapping',
        label: gettext('User Mappings'),
        type: 'coll-user_mapping',
        columns: ['name'],
      });
  }

  // Extend the browser's node class for user mapping node
  if (!pgBrowser.Nodes['user_mapping']) {
    pgAdmin.Browser.Nodes['user_mapping'] = pgAdmin.Browser.Node.extend({
      parent_type: 'foreign_server',
      type: 'user_mapping',
      sqlAlterHelp: 'sql-alterusermapping.html',
      sqlCreateHelp: 'sql-createusermapping.html',
      dialogHelp: url_for('help.static', {'filename': 'user_mapping_dialog.html'}),
      label: gettext('User Mapping'),
      hasSQL:  true,
      hasDepends: true,
      canDrop: true,
      canDropCascade: true,
      Init: function() {

        // Avoid multiple registration of menus
        if (this.initialized)
          return;

        this.initialized = true;

        /* Create foreign server context menu at database,
         * user mapping collections and user mapping node
         */
        pgBrowser.add_menus([{
          name: 'create_user_mapping_on_coll', node: 'coll-user_mapping', module: this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('User Mapping...'),
          icon: 'wcTabIcon icon-user_mapping', data: {action: 'create'},
        },{
          name: 'create_user_mapping', node: 'user_mapping', module: this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('User Mapping...'),
          icon: 'wcTabIcon icon-user_mapping', data: {action: 'create'},
        },{
          name: 'create_user_mapping', node: 'foreign_server', module: this,
          applies: ['object', 'context'], callback: 'show_obj_properties',
          category: 'create', priority: 4, label: gettext('User Mapping...'),
          icon: 'wcTabIcon icon-user_mapping', data: {action: 'create'},
        },
        ]);
      },

      getSchema: function(treeNodeInfo, itemNodeData) {
        return new UserMappingSchema(
          {
            role: ()=>getNodeListByName('role', treeNodeInfo, itemNodeData, {}, ()=>true, (res)=>{
              res.unshift({
                label: 'CURRENT_USER', value: 'CURRENT_USER',
                image: 'icon-role',
              },{
                label: 'PUBLIC', value: 'PUBLIC', image: 'icon-role',
              });
              return res;
            })
          },
          {
            name: pgBrowser.serverInfo[treeNodeInfo.server._id].user.name,
          }
        );
      },

      // Defining model for user mapping node
      model: pgAdmin.Browser.Node.Model.extend({
        idAttribute: 'oid',

        // Default values!
        initialize: function(attrs, args) {
          let isNew = (_.size(attrs) === 0);

          if (isNew) {
            let userInfo = pgBrowser.serverInfo[args.node_info.server._id].user;

            this.set({'name': userInfo.name}, {silent: true});
          }
          pgAdmin.Browser.Node.Model.prototype.initialize.apply(this, arguments);
        },
      }),
    });

  }

  return pgBrowser.Nodes['coll-user_mapping'];
});
