FROM centos:latest
MAINTAINER Adrien Bustany <adrien@bustany.org>

RUN rpm -ivh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
RUN yum -y --enablerepo=epel-testing install gcc-c++ git mercurial exiv2-devel ImageMagick-devel golang
ADD docker-build.sh /usr/local/bin/build-gollery
CMD /usr/local/bin/build-gollery
